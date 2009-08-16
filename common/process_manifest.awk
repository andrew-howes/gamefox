# A lot of this isn't needed for GameFOX but I'm intimidated by awk.
{ content = $1 ~ /^(content|skin|locale)$/ }
content && $NF ~ /^[a-z]/ { $NF = "/" $NF }
content {
    sub(/^\.\./, "", $NF);
    $NF = "jar:chrome/" name ".jar!" $NF
}
{
    sub("^\\.\\./common/", "", $NF)
    print
}

