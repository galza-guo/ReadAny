import Darwin
import Foundation
import StoreKit

private struct StoreKitBridgeStatus: Codable {
    let isActive: Bool
    let productId: String?
    let displayName: String?
    let displayPrice: String?
    let expiresAt: String?
    let transactionJws: String?
    let message: String?

    static func inactive(_ message: String) -> StoreKitBridgeStatus {
        StoreKitBridgeStatus(
            isActive: false,
            productId: nil,
            displayName: nil,
            displayPrice: nil,
            expiresAt: nil,
            transactionJws: nil,
            message: message
        )
    }
}

private let isoFormatter = ISO8601DateFormatter()

private func parseProductIds(_ productIdsJson: UnsafePointer<CChar>?) -> [String] {
    guard let productIdsJson else {
        return []
    }

    let raw = String(cString: productIdsJson)
    guard let data = raw.data(using: .utf8),
          let productIds = try? JSONDecoder().decode([String].self, from: data) else {
        return []
    }

    return productIds
        .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
        .filter { !$0.isEmpty }
}

private func duplicateJson(_ status: StoreKitBridgeStatus) -> UnsafeMutablePointer<CChar>? {
    let encoder = JSONEncoder()
    guard let data = try? encoder.encode(status),
          let json = String(data: data, encoding: .utf8) else {
        return strdup("{\"isActive\":false,\"message\":\"StoreKit bridge encoding failed.\"}")
    }

    return strdup(json)
}

private func runStoreKitOperation(
    _ operation: @escaping () async -> StoreKitBridgeStatus
) -> UnsafeMutablePointer<CChar>? {
    let semaphore = DispatchSemaphore(value: 0)
    let lock = NSLock()
    var status = StoreKitBridgeStatus.inactive("StoreKit did not complete.")

    Task {
        let result = await operation()
        lock.lock()
        status = result
        lock.unlock()
        semaphore.signal()
    }

    semaphore.wait()
    lock.lock()
    let finalStatus = status
    lock.unlock()

    return duplicateJson(finalStatus)
}

private func statusFromVerifiedTransaction(
    _ transaction: Transaction,
    jwsRepresentation: String,
    product: Product?
) -> StoreKitBridgeStatus {
    let expiresAt = transaction.expirationDate.map { isoFormatter.string(from: $0) }
    let isExpired = transaction.expirationDate.map { $0 <= Date() } ?? false
    let isActive = transaction.revocationDate == nil && !isExpired

    return StoreKitBridgeStatus(
        isActive: isActive,
        productId: transaction.productID,
        displayName: product?.displayName,
        displayPrice: product?.displayPrice,
        expiresAt: expiresAt,
        transactionJws: isActive ? jwsRepresentation : nil,
        message: isActive ? nil : "The subscription is not active."
    )
}

private func currentEntitlement(productIds: [String]) async -> StoreKitBridgeStatus {
    guard !productIds.isEmpty else {
        return .inactive("No StoreKit product IDs are configured.")
    }

    let allowedProductIds = Set(productIds)
    let product = try? await firstConfiguredProduct(productIds: productIds)

    for await verification in Transaction.currentEntitlements {
        switch verification {
        case .verified(let transaction):
            guard allowedProductIds.contains(transaction.productID) else {
                continue
            }
            return statusFromVerifiedTransaction(
                transaction,
                jwsRepresentation: verification.jwsRepresentation,
                product: product
            )
        case .unverified:
            continue
        }
    }

    if let product {
        return StoreKitBridgeStatus(
            isActive: false,
            productId: product.id,
            displayName: product.displayName,
            displayPrice: product.displayPrice,
            expiresAt: nil,
            transactionJws: nil,
            message: "No active readani subscription was found."
        )
    }

    return .inactive("No active readani subscription was found.")
}

private func firstConfiguredProduct(productIds: [String]) async throws -> Product? {
    let products = try await Product.products(for: productIds)

    for productId in productIds {
        if let product = products.first(where: { $0.id == productId }) {
            return product
        }
    }

    return products.first
}

private func purchase(productIds: [String]) async -> StoreKitBridgeStatus {
    guard !productIds.isEmpty else {
        return .inactive("No StoreKit product IDs are configured.")
    }

    do {
        guard let product = try await firstConfiguredProduct(productIds: productIds) else {
            return .inactive("No readani subscription products were found.")
        }

        let result = try await product.purchase()

        switch result {
        case .success(let verification):
            switch verification {
            case .verified(let transaction):
                let status = statusFromVerifiedTransaction(
                    transaction,
                    jwsRepresentation: verification.jwsRepresentation,
                    product: product
                )
                await transaction.finish()
                return status
            case .unverified(_, let error):
                return .inactive("StoreKit could not verify the purchase: \(error.localizedDescription)")
            }
        case .userCancelled:
            return .inactive("Purchase was cancelled.")
        case .pending:
            return .inactive("Purchase is pending approval.")
        @unknown default:
            return .inactive("StoreKit returned an unknown purchase result.")
        }
    } catch {
        return .inactive("StoreKit purchase failed: \(error.localizedDescription)")
    }
}

private func restore(productIds: [String]) async -> StoreKitBridgeStatus {
    do {
        try await AppStore.sync()
        return await currentEntitlement(productIds: productIds)
    } catch {
        return .inactive("StoreKit restore failed: \(error.localizedDescription)")
    }
}

@_cdecl("readani_storekit_current_entitlement")
public func readani_storekit_current_entitlement(
    _ productIdsJson: UnsafePointer<CChar>?
) -> UnsafeMutablePointer<CChar>? {
    let productIds = parseProductIds(productIdsJson)
    return runStoreKitOperation {
        await currentEntitlement(productIds: productIds)
    }
}

@_cdecl("readani_storekit_purchase")
public func readani_storekit_purchase(
    _ productIdsJson: UnsafePointer<CChar>?
) -> UnsafeMutablePointer<CChar>? {
    let productIds = parseProductIds(productIdsJson)
    return runStoreKitOperation {
        await purchase(productIds: productIds)
    }
}

@_cdecl("readani_storekit_restore")
public func readani_storekit_restore(
    _ productIdsJson: UnsafePointer<CChar>?
) -> UnsafeMutablePointer<CChar>? {
    let productIds = parseProductIds(productIdsJson)
    return runStoreKitOperation {
        await restore(productIds: productIds)
    }
}

@_cdecl("readani_storekit_free_string")
public func readani_storekit_free_string(_ value: UnsafeMutablePointer<CChar>?) {
    free(value)
}
