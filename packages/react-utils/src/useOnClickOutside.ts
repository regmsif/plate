import React from 'react';

const canUsePassiveEvents = (): boolean => {
  if (
    typeof window === 'undefined' ||
    typeof window.addEventListener !== 'function'
  )
    return false;

  let passive = false;
  const options = Object.defineProperty({}, 'passive', {
    get() {
      passive = true;
    },
  });
  const noop = () => null;

  window.addEventListener('test', noop, options);
  window.removeEventListener('test', noop, options);

  return passive;
};

export const DEFAULT_IGNORE_CLASS = 'ignore-onclickoutside';

export type UseOnClickOutsideCallback<T extends Event = Event> = (
  event: T
) => void;

export interface UseOnClickOutsideOptions {
  detectIFrame?: boolean;
  disabled?: boolean;
  eventTypes?: string[];
  excludeScrollbar?: boolean;
  ignoreClass?: string[] | string;
  refs?: Refs;
}

export type UseOnClickOutsideReturn = (element: El | null) => void;

type El = HTMLElement;

type Refs = React.RefObject<El | null>[];

const checkClass = (el: HTMLElement, cl: string): boolean =>
  el.classList?.contains(cl);

const hasIgnoreClass = (e: any, ignoreClass: string[] | string): boolean => {
  let el = e.target || e;

  while (el) {
    if (Array.isArray(ignoreClass)) {
      if (ignoreClass.some((c) => checkClass(el, c))) return true;
    } else if (checkClass(el, ignoreClass)) {
      return true;
    }

    el = el.parentElement;
  }

  return false;
};

const clickedOnScrollbar = (e: MouseEvent): boolean =>
  document.documentElement.clientWidth <= e.clientX ||
  document.documentElement.clientHeight <= e.clientY;

const getEventOptions = (type: string): { passive: boolean } | boolean =>
  type.includes('touch') && canUsePassiveEvents() ? { passive: true } : false;

export const useOnClickOutside = (
  callback: UseOnClickOutsideCallback,
  {
    detectIFrame = true,
    disabled,
    eventTypes = ['mousedown', 'touchstart'],
    excludeScrollbar,
    ignoreClass = DEFAULT_IGNORE_CLASS,
    refs: refsOpt,
  }: UseOnClickOutsideOptions = {}
): UseOnClickOutsideReturn => {
  const [refsState, setRefsState] = React.useState<Refs>([]);
  const callbackRef = React.useRef(callback);
  callbackRef.current = callback;

  const ref: UseOnClickOutsideReturn = React.useCallback(
    (el) => setRefsState((prevState) => [...prevState, { current: el }]),
    []
  );

  React.useEffect(
    () => {
      if (!refsOpt?.length && refsState.length === 0) return;

      const getEls = () => {
        const els: El[] = [];
        (refsOpt || refsState).forEach(
          ({ current }) => current && els.push(current)
        );

        return els;
      };

      const handler = (e: any) => {
        if (
          !hasIgnoreClass(e, ignoreClass) &&
          !(excludeScrollbar && clickedOnScrollbar(e)) &&
          getEls().every((el) => !el.contains(e.target))
        )
          callbackRef.current(e);
      };

      const blurHandler = (e: FocusEvent) =>
        // On firefox the iframe becomes document.activeElement in the next event loop
        setTimeout(() => {
          const { activeElement } = document;

          if (
            activeElement?.tagName === 'IFRAME' &&
            !hasIgnoreClass(activeElement, ignoreClass) &&
            !getEls().includes(activeElement as HTMLIFrameElement)
          )
            callbackRef.current(e);
        }, 0);

      const removeEventListener = () => {
        eventTypes.forEach((type) =>
          document.removeEventListener(
            type,
            handler,
            getEventOptions(type) as any
          )
        );

        if (detectIFrame) window.removeEventListener('blur', blurHandler);
      };

      if (disabled) {
        removeEventListener();

        return;
      }

      eventTypes.forEach((type) =>
        document.addEventListener(type, handler, getEventOptions(type))
      );

      if (detectIFrame) window.addEventListener('blur', blurHandler);

      return () => removeEventListener();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      refsState,
      ignoreClass,
      excludeScrollbar,
      disabled,
      detectIFrame,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      JSON.stringify(eventTypes),
    ]
  );

  return ref;
};
