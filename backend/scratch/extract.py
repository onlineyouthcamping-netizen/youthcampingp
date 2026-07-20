import sys, fitz
doc = fitz.open(sys.argv[1])
text = ""
for page in doc:
    text += page.get_text()
print(text)
