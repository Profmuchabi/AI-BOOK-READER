/**
 * Generates a simple book icon SVG as a base64 encoded data URI.
 * This can be used for the Media Session API artwork. While some platforms
 * prefer raster images (like PNG), an SVG data URI is a lightweight,
 * dependency-free way to provide an icon.
 * @param size The width and height of the icon.
 * @returns A string representing the data URI for the SVG image.
 */
export const getGeneratedArtworkURI = (size: number): string => {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
            <rect x="0" y="0" width="24" height="24" fill="#2563eb" />
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
};
