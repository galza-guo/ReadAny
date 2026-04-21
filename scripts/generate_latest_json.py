#!/usr/bin/env python3

import argparse
import json
from pathlib import Path


def read_signature(path: str) -> str:
    return Path(path).read_text(encoding="utf-8").strip()


def build_platform(url_base: str, artifact_path: str, signature_path: str) -> dict[str, str]:
    artifact_name = Path(artifact_path).name
    return {
        "url": f"{url_base}/{artifact_name}",
        "signature": read_signature(signature_path),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate a Tauri updater latest.json manifest.")
    parser.add_argument("--version", required=True)
    parser.add_argument("--pub-date", required=True)
    parser.add_argument("--notes-file", required=True)
    parser.add_argument("--base-url", required=True)
    parser.add_argument("--windows-artifact", required=True)
    parser.add_argument("--windows-signature", required=True)
    parser.add_argument("--macos-artifact", required=True)
    parser.add_argument("--macos-signature", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    notes = Path(args.notes_file).read_text(encoding="utf-8")
    windows_entry = build_platform(args.base_url, args.windows_artifact, args.windows_signature)
    macos_entry = build_platform(args.base_url, args.macos_artifact, args.macos_signature)

    manifest = {
        "version": args.version,
        "notes": notes,
        "pub_date": args.pub_date,
        "platforms": {
            "windows-x86_64": windows_entry,
            "darwin-aarch64": macos_entry,
            "darwin-x86_64": macos_entry,
        },
    }

    output_path = Path(args.output)
    output_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
