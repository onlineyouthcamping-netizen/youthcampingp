declare module "react-dom" {
  export function createPortal(
    children: React.ReactNode,
    container: Element | DocumentFragment,
    key?: null | string,
  ): React.ReactPortal;
  export function findDOMNode(
    instance: React.ReactInstance | null | undefined,
  ): Element | null | Text;
  export function render(
    element: React.DOMElement<React.DOMAttributes<Element>, Element>,
    container: Element | null,
    callback?: () => void,
  ): Element;
  export function unmountComponentAtNode(container: Element): boolean;
  export const version: string;
}
