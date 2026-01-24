SIZES = 16 48 128
PNGS = $(SIZES:%=dist/icon%.png) $(SIZES:%=dist/icon%-grey.png) $(SIZES:%=dist/icon%-light.png) $(SIZES:%=dist/icon%-grey-light.png)

all: icons

icons: dist $(PNGS)

dist:
	mkdir -p dist

# Dark icons (for light mode)
dist/icon16.png: assets/icon16.svg | dist
	rsvg-convert -w 16 -h 16 $< -o $@

dist/icon48.png: assets/icon48.svg | dist
	rsvg-convert -w 48 -h 48 $< -o $@

dist/icon128.png: assets/icon128.svg | dist
	rsvg-convert -w 128 -h 128 $< -o $@

dist/icon16-grey.png: assets/icon16-grey.svg | dist
	rsvg-convert -w 16 -h 16 $< -o $@

dist/icon48-grey.png: assets/icon48-grey.svg | dist
	rsvg-convert -w 48 -h 48 $< -o $@

dist/icon128-grey.png: assets/icon128-grey.svg | dist
	rsvg-convert -w 128 -h 128 $< -o $@

# Light icons (for dark mode)
dist/icon16-light.png: assets/icon16-light.svg | dist
	rsvg-convert -w 16 -h 16 $< -o $@

dist/icon48-light.png: assets/icon48-light.svg | dist
	rsvg-convert -w 48 -h 48 $< -o $@

dist/icon128-light.png: assets/icon128-light.svg | dist
	rsvg-convert -w 128 -h 128 $< -o $@

dist/icon16-grey-light.png: assets/icon16-grey-light.svg | dist
	rsvg-convert -w 16 -h 16 $< -o $@

dist/icon48-grey-light.png: assets/icon48-grey-light.svg | dist
	rsvg-convert -w 48 -h 48 $< -o $@

dist/icon128-grey-light.png: assets/icon128-grey-light.svg | dist
	rsvg-convert -w 128 -h 128 $< -o $@

clean:
	rm -f $(PNGS)

.PHONY: all icons clean
