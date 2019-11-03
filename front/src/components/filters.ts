export interface Filter {
    readonly name: string;
    readonly unit: string;
    readonly func: (image: ImageData, args: any) => ImageData;
}

export class Filters {


    public static none(pixels: ImageData, args: any): ImageData {
        return pixels;
    }

    public static grayscale(pixels: ImageData, args: { level: number }): ImageData {
        const d = pixels.data;
        for (let i = 0; i < d.length; i += 4) {
            const r = d[i];
            const g = d[i + 1];
            const b = d[i + 2];
            // CIE luminance for the RGB
            // The human eye is bad at seeing red and blue, so we de-emphasize them.
            const v = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            d[i] = d[i + 1] = d[i + 2] = v
        }
        return pixels;
    }

}