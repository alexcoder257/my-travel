"""Fix Google Maps URLs in TravelPlan_filled.xlsx.

Two fixes:
  1) Rewrites every map URL to the official Google Universal URL API
     (maps/search/?api=1&query=...) — the only format Google documents as stable.
     Also corrects one logical bug: Day-5 "Nghỉ tại khách sạn" was pointing at the
     Singapore hotel; the KL stay is 1000 Miles Hotel.
  2) Decodes XML numeric character references for SMP codepoints (> U+FFFF) back
     to raw UTF-8 bytes inside sheet1.xml. SheetJS 0.18.5 silently drops NCRs for
     codepoints that need surrogate pairs, which was stripping most emojis
     (🍢 🏨 🐸 🛄 💎 🚇 …) on import. BMP chars (✈ ☕ ⭐) stay as NCRs since those
     parse fine.
"""

from urllib.parse import quote_plus
import re
import shutil
import zipfile
import openpyxl

SRC = "/Users/macbook/Desktop/TravelPlan_filled.xlsx"

def search(q: str) -> str:
    return f"https://www.google.com/maps/search/?api=1&query={quote_plus(q)}"

def directions(origin: str, destination: str, mode: str = "transit") -> str:
    return (
        "https://www.google.com/maps/dir/?api=1"
        f"&origin={quote_plus(origin)}"
        f"&destination={quote_plus(destination)}"
        f"&travelmode={mode}"
    )

ROW_URLS = {
    3:  search("Singapore Changi Airport"),
    4:  search("Singapore Changi Airport Terminal 1"),
    5:  search("Jewel Changi Airport"),
    6:  directions("Changi Airport MRT Station", "Aljunied MRT Station", "transit"),
    7:  search("Old Chang Kee Aljunied MRT Singapore"),
    8:  search("ibis budget Singapore Pearl 21 Lorong 14 Geylang"),
    9:  search("Geylang Lorong 9 Fresh Frog Porridge Singapore"),
    10: search("Ya Kun Kaya Toast Dhoby Ghaut Singapore"),
    11: search("Fort Canning Park Singapore"),
    12: search("National Gallery Singapore"),
    13: search("Chinatown Complex Singapore"),
    14: search("Sultan Mosque Kampong Glam Singapore"),
    15: search("3 Meals a Day Sim Lim Square Singapore"),
    16: search("ibis budget Singapore Pearl"),
    17: search("Merlion Park Singapore"),
    18: search("Keng Eng Kee Seafood Bukit Merah Singapore"),
    19: search("ibis budget Singapore Pearl"),
    20: search("Swee Choon Tim Sum Restaurant Jalan Besar Singapore"),
    21: search("Koon Seng Road Peranakan Houses Singapore"),
    22: search("ibis budget Singapore Pearl"),
    23: search("Tai Seng MRT Station Singapore"),
    24: search("Terminal Bersepadu Selatan TBS Kuala Lumpur"),
    25: search("1000 Miles Hotel Kuala Lumpur"),
    26: search("Petaling Street Chinatown Kuala Lumpur"),
    27: search("Chow Kit Kuala Lumpur"),
    28: search("Bazaar Chow Kit Kuala Lumpur"),
    29: search("Restoran Yut Kee Kuala Lumpur"),
    30: search("Cheevit Cheeva Bukit Bintang Kuala Lumpur"),
    31: search("Cheevit Cheeva Bukit Bintang Kuala Lumpur"),
    32: search("Masjid Putra Putrajaya"),
    33: search("Masjid Putra Putrajaya"),
    34: search("KLCC Park Kuala Lumpur"),
    35: search("Petronas Twin Towers Kuala Lumpur"),
    36: search("Oriental Kopi Suria KLCC Kuala Lumpur"),
    37: search("Bungkus Kawkaw Teh Tarik Kuala Lumpur"),
    38: search("Lake Symphony Fountain KLCC Kuala Lumpur"),
    39: search("1000 Miles Hotel Kuala Lumpur"),
    40: search("Ho Kow Hainam Kopitiam Lebuh Ampang Kuala Lumpur"),
    41: search("Thean Hou Temple Kuala Lumpur"),
    42: search("Thean Hou Temple Kuala Lumpur"),
    43: search("Masjid Wilayah Persekutuan Federal Territory Mosque Kuala Lumpur"),
    44: search("Masjid Wilayah Persekutuan Federal Territory Mosque Kuala Lumpur"),
    45: search("Heun Kee Claypot Chicken Rice Pudu Kuala Lumpur"),
    46: search("Heun Kee Claypot Chicken Rice Pudu Kuala Lumpur"),
    47: search("1000 Miles Hotel Kuala Lumpur"),
    48: search("1000 Miles Hotel Kuala Lumpur"),  # was: ibis Singapore — WRONG city
    49: search("BookXcess REXKL Jalan Sultan Kuala Lumpur"),
    50: search("BookXcess REXKL Jalan Sultan Kuala Lumpur"),
    51: search("KLCG Confectionery Bakery Jalan Ampang Kuala Lumpur"),
    52: search("KLCG Confectionery Bakery Jalan Ampang Kuala Lumpur"),
    53: search("Jalan Alor Food Street Kuala Lumpur"),
    54: search("Jalan Alor Food Street Kuala Lumpur"),
    55: search("Win Heng Seng Bukit Bintang Kuala Lumpur"),
    56: search("1000 Miles Hotel Kuala Lumpur"),
    57: search("Kim Soya Bean Jalan Hang Lekir Kuala Lumpur"),
    58: search("Sri Mahamariamman Temple Kuala Lumpur"),
    59: search("Kwai Chai Hong Kuala Lumpur"),
    60: search("Petaling Street Kuala Lumpur"),
    61: search("Central Market Pasar Seni Kuala Lumpur"),
    62: search("Nostalgia Newsphoto Studio Kuala Lumpur"),
    63: search("Dataran Merdeka Sultan Abdul Samad Building Kuala Lumpur"),
    64: search("Nyonya restaurant Petaling Street Kuala Lumpur"),
    65: search("The Exchange TRX Mall Kuala Lumpur"),
    66: search("Tofu G Gelato The Exchange TRX Kuala Lumpur"),
    67: search("1000 Miles Hotel Kuala Lumpur"),
    68: search("Kuala Lumpur International Airport KLIA"),
    69: search("Kuala Lumpur International Airport KLIA"),
}


def apply_url_fixes() -> None:
    wb = openpyxl.load_workbook(SRC)
    ws = wb["Lịch trình"]
    for row_idx, url in ROW_URLS.items():
        ws.cell(row=row_idx, column=9, value=url)
    wb.save(SRC)


SMP_NCR = re.compile(rb"&#(\d+);")

def _replace_smp(match: "re.Match[bytes]") -> bytes:
    n = int(match.group(1))
    # Only rewrite supplementary-plane chars. BMP NCRs parse fine in SheetJS.
    if n > 0xFFFF:
        return chr(n).encode("utf-8")
    return match.group(0)

def rewrite_smp_as_utf8() -> None:
    """Read the xlsx zip, rewrite NCRs in sheet XMLs to raw UTF-8, repack."""
    tmp = SRC + ".tmp"
    with zipfile.ZipFile(SRC, "r") as zin, zipfile.ZipFile(
        tmp, "w", zipfile.ZIP_DEFLATED
    ) as zout:
        for info in zin.infolist():
            data = zin.read(info.filename)
            if info.filename.startswith("xl/worksheets/") or info.filename == "xl/sharedStrings.xml":
                data = SMP_NCR.sub(_replace_smp, data)
            zout.writestr(info, data)
    shutil.move(tmp, SRC)


def main() -> None:
    apply_url_fixes()
    rewrite_smp_as_utf8()
    print(f"Fixed {len(ROW_URLS)} URLs and normalized SMP emoji encoding in {SRC}")


if __name__ == "__main__":
    main()
