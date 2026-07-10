#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <encoded-env-file> <command> [args...]" >&2
  exit 64
fi

env_file="$1"
shift

if [ ! -f "${env_file}" ]; then
  echo "Encoded deployment environment file was not found." >&2
  exit 66
fi

cleanup() {
  rm -f "${env_file}"
}
trap cleanup EXIT

while IFS='=' read -r encoded_key encoded_value; do
  if [ -z "${encoded_key}" ]; then
    continue
  fi
  if [[ ! "${encoded_key}" =~ ^[A-Z][A-Z0-9_]*_B64$ ]]; then
    echo "Invalid deployment environment key format." >&2
    exit 65
  fi

  variable="${encoded_key%_B64}"
  value="$(printf '%s' "${encoded_value}" | base64 --decode)"
  export "${variable}=${value}"
done < "${env_file}"

"$@"
