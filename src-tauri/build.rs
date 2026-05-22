fn main() {
    compile_storekit_bridge();
    tauri_build::build()
}

fn compile_storekit_bridge() {
    if std::env::var("CARGO_CFG_TARGET_OS").as_deref() != Ok("macos") {
        return;
    }

    let out_dir = std::path::PathBuf::from(
        std::env::var("OUT_DIR").expect("OUT_DIR must be set by Cargo"),
    );
    let bridge_source = std::path::PathBuf::from("macos/StoreKitBridge.swift");
    let bridge_library = out_dir.join("libreadani_storekit.a");

    println!("cargo:rerun-if-changed={}", bridge_source.display());

    let status = std::process::Command::new("xcrun")
        .args([
            "swiftc",
            "-parse-as-library",
            "-emit-library",
            "-static",
            "-O",
            "-o",
        ])
        .arg(&bridge_library)
        .arg(&bridge_source)
        .status()
        .expect("failed to run swiftc for StoreKit bridge");

    if !status.success() {
        panic!("swiftc failed while compiling StoreKit bridge");
    }

    println!("cargo:rustc-link-search=native={}", out_dir.display());
    println!("cargo:rustc-link-lib=static=readani_storekit");
    println!("cargo:rustc-link-lib=framework=Foundation");
    println!("cargo:rustc-link-lib=framework=StoreKit");

    for swift_runtime_path in swift_runtime_search_paths() {
        println!("cargo:rustc-link-search=native={}", swift_runtime_path.display());
        println!(
            "cargo:rustc-link-arg=-Wl,-rpath,{}",
            swift_runtime_path.display()
        );
    }
}

fn swift_runtime_search_paths() -> Vec<std::path::PathBuf> {
    ["/usr/lib/swift"]
    .into_iter()
    .map(std::path::PathBuf::from)
    .collect()
}
