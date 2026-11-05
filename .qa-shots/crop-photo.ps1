Add-Type -AssemblyName System.Drawing

$src = 'C:/Users/HP/.zcode/cli/image-cache/sess_64e6cd60-dadb-4264-a7a5-d2689879ce10/image-924655fc6e0ffbe825399189ae3795fb.png'
$bmp = [System.Drawing.Bitmap]::FromFile($src)
function Hex($c) { '#{0:X2}{1:X2}{2:X2}' -f $c.R, $c.G, $c.B }

Write-Output '=== HEADING glyph bbox: y 130..255, colored/dark px extent ==='
$minX = 9999; $maxX = 0; $runs = @(); $start = -1
for ($x = 200; $x -le 1500; $x++) {
    $hit = $false
    for ($y = 130; $y -le 255; $y += 2) {
        $c = $bmp.GetPixel($x, $y)
        if (($c.R + $c.G + $c.B) -lt 690) { $hit = $true; break }
    }
    if ($hit) { if ($x -lt $minX) { $minX = $x }; if ($x -gt $maxX) { $maxX = $x } }
    if ($hit -and $start -eq -1) { $start = $x }
    if ((!$hit -or $x -eq 1500) -and $start -ne -1) {
        $end = if ($hit) { $x } else { $x - 1 }
        if ($end - $start -ge 2) { $runs += "${start}-${end}" }
        $start = -1
    }
}
Write-Output ("heading glyph x-extent: ${minX}..${maxX}  center=" + [int](($minX+$maxX)/2))
Write-Output ("word runs: " + ($runs -join '  '))

Write-Output '=== SUBTITLE bbox: y 255..300 dark px ==='
$minX = 9999; $maxX = 0
for ($x = 300; $x -le 1400; $x++) {
    for ($y = 255; $y -le 300; $y += 2) {
        $c = $bmp.GetPixel($x, $y)
        if (($c.R + $c.G + $c.B) -lt 400) { if ($x -lt $minX) { $minX = $x }; if ($x -gt $maxX) { $maxX = $x }; break }
    }
}
Write-Output ("subtitle x-extent: ${minX}..${maxX}  center=" + [int](($minX+$maxX)/2))

Write-Output '=== MYSTERY TEXT y 895..915: glyph runs (x 90..730) ==='
$runs = @(); $start = -1
for ($x = 90; $x -le 730; $x++) {
    $hit = $false
    for ($y = 895; $y -le 915; $y += 2) {
        $c = $bmp.GetPixel($x, $y)
        if (($c.R + $c.G + $c.B) -lt 500) { $hit = $true; break }
    }
    if ($hit -and $start -eq -1) { $start = $x }
    if ((!$hit -or $x -eq 730) -and $start -ne -1) {
        $end = if ($hit) { $x } else { $x - 1 }
        $runs += "${start}-${end}"; $start = -1
    }
}
Write-Output ("glyph runs: " + ($runs -join '  '))

Write-Output '=== CARD top-left corner: first white row per x (radius probe) x 74..150 ==='
$out = @()
for ($x = 74; $x -le 150; $x += 2) {
    for ($y = 330; $y -le 380; $y++) {
        $c = $bmp.GetPixel($x, $y)
        if ($c.R -gt 250 -and $c.G -gt 250) { $out += "${x}:y$y"; break }
    }
}
Write-Output ($out -join '  ')

Write-Output '=== DIVIDER extent at y=448: x 74..730 purple-ish runs ==='
$runs = @(); $start = -1
for ($x = 74; $x -le 730; $x++) {
    $c = $bmp.GetPixel($x, 448)
    $hit = ($c.B -gt 150 -and $c.B - $c.G -gt 40)
    if ($hit -and $start -eq -1) { $start = $x }
    if ((!$hit -or $x -eq 730) -and $start -ne -1) {
        $end = if ($hit) { $x } else { $x - 1 }
        if ($end - $start -ge 1) { $runs += "${start}-${end}" }
        $start = -1
    }
}
Write-Output ("divider runs: " + ($runs -join '  '))

Write-Output '=== COUNTER pill extent: y=394 (pill mid), lavender-bg x runs ==='
$runs = @(); $start = -1
for ($x = 400; $x -le 730; $x++) {
    $c = $bmp.GetPixel($x, 394)
    $hit = ($c.R -ge 235 -and $c.R -le 250 -and $c.B - $c.R -gt 6)
    if ($hit -and $start -eq -1) { $start = $x }
    if ((!$hit -or $x -eq 730) -and $start -ne -1) {
        $end = if ($hit) { $x } else { $x - 1 }
        if ($end - $start -ge 8) { $runs += "${start}-${end}" }
        $start = -1
    }
}
Write-Output ("pill runs: " + ($runs -join '  '))

Write-Output '=== PHOTO FRAME: exact edges at y=560 x 735..1400 (lavender runs) ==='
$runs = @(); $start = -1
for ($x = 735; $x -le 1400; $x++) {
    $c = $bmp.GetPixel($x, 560)
    $hit = ($c.B - $c.R -gt 6)
    if ($hit -and $start -eq -1) { $start = $x }
    if ((!$hit -or $x -eq 1400) -and $start -ne -1) {
        $end = if ($hit) { $x } else { $x - 1 }
        if ($end - $start -ge 4) { $runs += "${start}-${end}" }
        $start = -1
    }
}
Write-Output ("lav runs y=560: " + ($runs -join '  '))

Write-Output '=== BACKDROP: bottom edge y probe x=1050, y 850..940 ==='
for ($y = 850; $y -le 905; $y += 3) { $c = $bmp.GetPixel(1050, $y); Write-Output ("y=$y " + (Hex $c)) }
Write-Output '=== BACKDROP: right edge x probe y=600, x 1360..1420 ==='
for ($x = 1360; $x -le 1420; $x += 3) { $c = $bmp.GetPixel($x, 600); Write-Output ("x=$x " + (Hex $c)) }

$bmp.Dispose()
