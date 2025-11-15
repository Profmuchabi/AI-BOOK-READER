// Since mammoth and ePub are loaded via script tags, they will be on the window object.
// We need to declare them to use them in TypeScript.
declare const mammoth: any;
declare const ePub: any;

import * as pdfjsLib from 'pdfjs-dist';

// Set up the PDF.js worker. This is crucial for performance.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

const parseTxt = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            resolve(e.target?.result as string);
        };
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
};

const parsePdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let content = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        content += textContent.items.map(item => ('str' in item ? item.str : '')).join(' ') + '\n\n';
    }
    return content;
};

const parseEpub = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const book = ePub(arrayBuffer);
    await book.ready;

    const allParagraphs: string[] = [];
    const spineItems = book.spine.items;

    for (const item of spineItems) {
        const doc = await item.load(book.load.bind(book));
        const body = doc.querySelector('body');
        if (body) {
            body.querySelectorAll('script, style, a, img, svg').forEach(el => el.remove());
            // A more robust way to get paragraphs
            const paragraphsInNode = Array.from(body.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote'))
                // FIX: Cast element to HTMLElement to access textContent property.
                .map(p => (p as HTMLElement).textContent?.trim() || '')
                .filter(p => p.length > 0);
            
            if (paragraphsInNode.length > 0) {
                 allParagraphs.push(...paragraphsInNode);
            }
        }
    }
    
    return allParagraphs.join('\n');
};


const parseDocx = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
};

export const parseBookFile = async (file: File): Promise<{ title: string; content: string }> => {
    const title = file.name.replace(/\.[^/.]+$/, '');
    let content: string;

    try {
        if (file.type === 'application/epub+zip' || file.name.endsWith('.epub')) {
            content = await parseEpub(file);
        } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
            content = await parseTxt(file);
        } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            content = await parsePdf(file);
        } else if (
            file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
            file.name.endsWith('.docx')
        ) {
            content = await parseDocx(file);
        } else {
            throw new Error(`Unsupported file type: .${file.name.split('.').pop()}`);
        }
       
        // Normalize content by cleaning up paragraphs
        content = content.split('\n').map(p => p.trim()).filter(p => p.length > 0).join('\n');

        return { title, content };
    } catch (error) {
        console.error(`Error parsing file ${file.name}:`, error);
        throw new Error(`Failed to parse ${file.name}. The file might be corrupted or in an unsupported format.`);
    }
};