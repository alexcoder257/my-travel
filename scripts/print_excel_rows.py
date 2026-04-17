import openpyxl

wb = openpyxl.load_workbook('scripts/Sing - Malay.xlsx')
sheet = wb.active

for i, row in enumerate(sheet.iter_rows(min_row=1, max_row=15, values_only=True), 1):
    print(i, row)
