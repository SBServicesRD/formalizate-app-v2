from pathlib import Path


def replace_line(path: Path, index: int, new_line: str) -> None:
    text = path.read_text()
    lines = text.splitlines()
    lines[index] = new_line
    path.write_bytes('\r\n'.join(lines).encode('utf-8'))


def main() -> None:
    file_path = Path('components/PostPaymentForm.tsx')
    replace_line(
        file_path,
        603,
        '                         <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />'
    )


if __name__ == '__main__':
    main()

