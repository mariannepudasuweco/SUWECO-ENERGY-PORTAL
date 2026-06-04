declare module 'dom-to-image-more' {
  interface DomToImage {
    toPng(element: HTMLElement, options?: any): Promise<string>;
    toJpeg(element: HTMLElement, options?: any): Promise<string>;
    toSvg(element: HTMLElement, options?: any): Promise<string>;
    toBlob(element: HTMLElement, options?: any): Promise<Blob>;
  }
  
  const domToImage: DomToImage;
  export default domToImage;
}
