$outputFile = "combined_source.txt"
Clear-Content $outputFile -ErrorAction SilentlyContinue

# HTML, CSS, JS の順に処理するようグループ化
$extensions = @(".html", ".css", ".js")

foreach ($ext in $extensions) {
    $files = Get-ChildItem -Filter "*$ext"
    foreach ($file in $files) {
        # 拡張子に合わせてコメント記号を変更
        $cStart = if ($ext -eq ".html") { "" } else { "*/" }

        Add-Content $outputFile "$cStart ========================================== $cEnd"
        Add-Content $outputFile "$cStart FILE_START: $($file.Name) $cEnd"
        Add-Content $outputFile "$cStart ========================================== $cEnd`n"
        
        Get-Content $file.FullName -Encoding UTF8 | Add-Content $outputFile
        
        Add-Content $outputFile "`n$cStart FILE_END: $($file.Name) $cEnd`n"
    }
}
Write-Host "結合が完了しました: $outputFile"