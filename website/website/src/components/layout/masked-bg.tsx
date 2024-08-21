import clsx from "clsx";

export const MaskedGridLines = () => (
  <div className="Section__backgroundMask absolute w-full h-full overflow-visible pointer-events-none">
    <div
      className={clsx(
        "Section__background border-t border-[rgba(230,235,241,.52)]",
        "relative h-full max-h-none top-0 left-0 w-full overflow-hidden",
      )}
    >
      <div
        className="Guides absolute top-0 left-0 h-full w-full px-[16px] pointer-events-none"
        aria-hidden="true"
      >
        <div className="Guides__container relative max-w-[1080px] mx-auto h-full grid grid-cols-4">
          <div className="Guides__guide"></div>
          <div className="Guides__guide"></div>
          <div className="Guides__guide"></div>
          <div className="Guides__guide"></div>
          <div className="Guides__guide"></div>
        </div>
      </div>
    </div>
  </div>
);
