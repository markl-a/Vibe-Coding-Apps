#!/bin/bash
# batch_rename.py 使用範例
# 這個腳本展示了批次重新命名工具的各種使用場景

# 設定腳本路徑
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BATCH_RENAME="$SCRIPT_DIR/batch_rename.py"

echo "========================================="
echo "Batch Rename 使用範例"
echo "========================================="
echo ""

# 範例 1: 添加前綴
echo "範例 1: 添加前綴到所有 JPG 檔案"
echo "指令: python3 $BATCH_RENAME --prefix 'IMG_' *.jpg"
echo "範例: photo.jpg -> IMG_photo.jpg"
echo ""
# python3 "$BATCH_RENAME" --prefix "IMG_" *.jpg

# 範例 2: 添加後綴（在副檔名前）
echo "範例 2: 添加後綴到所有文字檔案"
echo "指令: python3 $BATCH_RENAME --suffix '_backup' *.txt"
echo "範例: document.txt -> document_backup.txt"
echo ""
# python3 "$BATCH_RENAME" --suffix "_backup" *.txt

# 範例 3: 替換文字
echo "範例 3: 替換檔名中的文字"
echo "指令: python3 $BATCH_RENAME --replace 'old' 'new' *"
echo "範例: old_file.txt -> new_file.txt"
echo ""
# python3 "$BATCH_RENAME" --replace "old" "new" *

# 範例 4: 不區分大小寫替換
echo "範例 4: 不區分大小寫替換"
echo "指令: python3 $BATCH_RENAME --replace 'test' 'prod' * --ignore-case"
echo "範例: Test_file.txt -> prod_file.txt"
echo ""
# python3 "$BATCH_RENAME" --replace "test" "prod" * --ignore-case

# 範例 5: 添加序號
echo "範例 5: 添加序號到檔案名稱"
echo "指令: python3 $BATCH_RENAME --numbering *.pdf"
echo "範例: document.pdf -> document_001.pdf, report.pdf -> report_002.pdf"
echo ""
# python3 "$BATCH_RENAME" --numbering *.pdf

# 範例 6: 自定義序號格式
echo "範例 6: 自定義序號格式（從 10 開始，5 位數）"
echo "指令: python3 $BATCH_RENAME --numbering --start 10 --digits 5 *.jpg"
echo "範例: photo.jpg -> photo_00010.jpg"
echo ""
# python3 "$BATCH_RENAME" --numbering --start 10 --digits 5 --separator "-" *.jpg

# 範例 7: 使用正規表達式重新命名
echo "範例 7: 使用正規表達式重新命名"
echo "指令: python3 $BATCH_RENAME --regex '(\d{4})-(\d{2})' '\2-\1' *"
echo "範例: 2024-01-file.txt -> 01-2024-file.txt"
echo ""
# python3 "$BATCH_RENAME" --regex "(\d{4})-(\d{2})" "\2-\1" *

# 範例 8: 轉換為小寫
echo "範例 8: 將檔名轉換為小寫"
echo "指令: python3 $BATCH_RENAME --lowercase *.TXT"
echo "範例: FILE.TXT -> file.txt"
echo ""
# python3 "$BATCH_RENAME" --lowercase *.TXT

# 範例 9: 轉換為大寫
echo "範例 9: 將檔名轉換為大寫"
echo "指令: python3 $BATCH_RENAME --uppercase *.txt"
echo "範例: file.txt -> FILE.TXT"
echo ""
# python3 "$BATCH_RENAME" --uppercase *.txt

# 範例 10: 預覽模式（不實際重新命名）
echo "範例 10: 預覽模式（不實際重新命名）"
echo "指令: python3 $BATCH_RENAME --prefix 'IMG_' *.jpg --preview"
echo ""
# python3 "$BATCH_RENAME" --prefix "IMG_" *.jpg --preview

# 範例 11: 遞迴處理子目錄
echo "範例 11: 遞迴處理子目錄中的檔案"
echo "指令: python3 $BATCH_RENAME --lowercase '*.TXT' --recursive"
echo ""
# python3 "$BATCH_RENAME" --lowercase "*.TXT" --recursive

# 範例 12: 整理照片檔案
echo "範例 12: 整理照片檔案的實用腳本"
cat << 'PHOTO_ORGANIZER'
#!/bin/bash
# 整理照片檔案：添加日期前綴和序號

PHOTOS_DIR="$HOME/Pictures/unsorted"
BATCH_RENAME="/path/to/batch_rename.py"

cd "$PHOTOS_DIR" || exit 1

# 先預覽
echo "預覽重新命名..."
python3 "$BATCH_RENAME" \
    --prefix "$(date +'%Y%m%d')_" \
    --numbering \
    --start 1 \
    --digits 4 \
    *.jpg *.JPG \
    --preview

read -p "確定要重新命名嗎？(y/N): " confirm

if [ "$confirm" = "y" ]; then
    # 實際執行
    python3 "$BATCH_RENAME" \
        --prefix "$(date +'%Y%m%d')_" \
        --numbering \
        --start 1 \
        --digits 4 \
        *.jpg *.JPG

    echo "照片重新命名完成！"
fi
PHOTO_ORGANIZER

# 範例 13: 清理檔名中的特殊字元
echo ""
echo "範例 13: 清理檔名中的特殊字元"
cat << 'CLEAN_FILENAME'
#!/bin/bash
# 清理檔名中的空格和特殊字元

BATCH_RENAME="/path/to/batch_rename.py"

# 將空格替換為底線
python3 "$BATCH_RENAME" --replace " " "_" * --preview

read -p "確定要執行嗎？(y/N): " confirm

if [ "$confirm" = "y" ]; then
    python3 "$BATCH_RENAME" --replace " " "_" *

    # 移除括號
    python3 "$BATCH_RENAME" --regex "[()]" "" *

    # 移除多餘的底線
    python3 "$BATCH_RENAME" --regex "__+" "_" *
fi
CLEAN_FILENAME

# 範例 14: 標準化檔案命名
echo ""
echo "範例 14: 標準化專案檔案命名"
cat << 'STANDARDIZE'
#!/bin/bash
# 標準化專案檔案命名格式

PROJECT_DIR="$HOME/projects/myproject"
BATCH_RENAME="/path/to/batch_rename.py"

cd "$PROJECT_DIR" || exit 1

# 1. 轉換為小寫
python3 "$BATCH_RENAME" --lowercase * --recursive

# 2. 替換空格為底線
python3 "$BATCH_RENAME" --replace " " "_" * --recursive

# 3. 替換連字號為底線
python3 "$BATCH_RENAME" --replace "-" "_" * --recursive

echo "檔案命名標準化完成！"
STANDARDIZE

# 範例 15: 批次添加版本號
echo ""
echo "範例 15: 批次添加版本號"
cat << 'VERSION_SCRIPT'
#!/bin/bash
# 為文件添加版本號

VERSION="v2.0"
BATCH_RENAME="/path/to/batch_rename.py"

# 預覽
python3 "$BATCH_RENAME" \
    --suffix "_${VERSION}" \
    *.pdf \
    --preview

read -p "確定要添加版本號 ${VERSION} 嗎？(y/N): " confirm

if [ "$confirm" = "y" ]; then
    python3 "$BATCH_RENAME" --suffix "_${VERSION}" *.pdf
    echo "版本號添加完成！"
fi
VERSION_SCRIPT

# 範例 16: 撤銷上次重新命名
echo ""
echo "範例 16: 撤銷上次重新命名"
echo "指令: python3 $BATCH_RENAME --undo"
echo "注意: 只能撤銷最近一次的批次重新命名操作"
echo ""
# python3 "$BATCH_RENAME" --undo

# 範例 17: 處理媒體檔案
echo ""
echo "範例 17: 處理媒體檔案"
cat << 'MEDIA_RENAME'
#!/bin/bash
# 重新命名媒體檔案（音樂、影片）

MEDIA_DIR="$HOME/Media"
BATCH_RENAME="/path/to/batch_rename.py"

# 處理音樂檔案：移除 "Copy of" 前綴
cd "$MEDIA_DIR/Music" || exit 1
python3 "$BATCH_RENAME" --replace "Copy of " "" *.mp3

# 處理影片檔案：統一格式
cd "$MEDIA_DIR/Videos" || exit 1
python3 "$BATCH_RENAME" \
    --regex "^(.*)\.(mkv|avi|mov)$" "\1.mp4" \
    * \
    --preview
MEDIA_RENAME

# 範例 18: 日期格式轉換
echo ""
echo "範例 18: 日期格式轉換"
cat << 'DATE_FORMAT'
#!/bin/bash
# 轉換檔名中的日期格式
# 從 YYYY-MM-DD 轉換為 YYYYMMDD

BATCH_RENAME="/path/to/batch_rename.py"

python3 "$BATCH_RENAME" \
    --regex "(\d{4})-(\d{2})-(\d{2})" "\1\2\3" \
    * \
    --preview

read -p "確定要轉換日期格式嗎？(y/N): " confirm

if [ "$confirm" = "y" ]; then
    python3 "$BATCH_RENAME" \
        --regex "(\d{4})-(\d{2})-(\d{2})" "\1\2\3" \
        *
fi
DATE_FORMAT

echo ""
echo "========================================="
echo "提示："
echo "1. 使用 --preview 先預覽結果"
echo "2. 對重要檔案先備份再重新命名"
echo "3. 可以使用 --undo 撤銷最近一次操作"
echo "4. 正規表達式功能強大但需謹慎使用"
echo "5. 遞迴模式會處理所有子目錄的檔案"
echo "========================================="
