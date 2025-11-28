from PIL import Image

img = Image.open("cubo.png")
img.save("favicon.ico", format="ICO", sizes=[(32,32),(64,64),(128,128),(256,256)])
