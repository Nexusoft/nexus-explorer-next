import styles from 'components/Table/Pagination.module.scss';
import {
  BiChevronLeft,
  BiChevronRight,
  BiFirstPage,
  BiLastPage,
} from 'react-icons/bi';
import { debounce } from 'utils/common';

export const Pagination = ({ controls, isStaticPanination }) => {
  const {
    canPreviousPage,
    canNextPage,
    pageCount,
    gotoPage,
    setPageSize,
    pageIndex,
    pageSize,
  } = controls;

  const hasPageCount = Number.isFinite(pageCount);
  const currentPage =
    isStaticPanination || hasPageCount
      ? `${pageIndex + 1} of ${pageCount}`
      : `${pageIndex + 1}`;
  const dataPerPage = [10, 25, 50, 100];
  const _isStaticPanination = isStaticPanination ? true : hasPageCount;

  //typed page number to a valid page index
  const toPage = (value) => {
    let page = value ? Number(value) - 1 : 0;
    if (!Number.isFinite(page) || page < 0) page = 0;
    if (hasPageCount && page > pageCount - 1) page = pageCount - 1;
    return page;
  };

  const handleGotoPageInputChange = (e) => {
    const page = toPage(e.target.value);
    debounce(() => gotoPage(page), 700);
  };

  const handleGotoPageKeyDown = (e) => {
    if (e.key === 'Enter') gotoPage(toPage(e.target.value));
  };

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
  };

  return (
    <div className={styles.pagination}>
      <span className={styles.pagination__btn}>
        <button
          type="button"
          className={styles.pagination__btn__icon}
          aria-label="First page"
          onClick={() => gotoPage(0)}
          disabled={!canPreviousPage}>
          <BiFirstPage color="inherit" />
        </button>
        <button
          type="button"
          className={styles.pagination__btn__icon}
          aria-label="Previous page"
          onClick={() => gotoPage(pageIndex - 1)}
          disabled={!canPreviousPage}>
          <BiChevronLeft color="inherit" />
        </button>
        <span className={styles.pagination__btn__page}>
          Page <strong>{currentPage}</strong>
        </span>
        <button
          type="button"
          className={styles.pagination__btn__icon}
          aria-label="Next page"
          onClick={() => gotoPage(pageIndex + 1)}
          disabled={!canNextPage}>
          <BiChevronRight color="inherit" />
        </button>
        {_isStaticPanination && (
          <button
            type="button"
            className={styles.pagination__btn__icon}
            aria-label="Last page"
            onClick={() => gotoPage(pageCount - 1)}
            disabled={!canNextPage}>
            <BiLastPage color="inherit" />
          </button>
        )}
      </span>
      <div className={styles.pagination__goToPage}>
        <label className={styles.pagination__goToPage__pageSelect}>
          Go to page
          <input
            key={pageIndex}
            type="number"
            defaultValue={pageIndex + 1}
            onChange={handleGotoPageInputChange}
            onKeyDown={handleGotoPageKeyDown}
            min={1}
            max={hasPageCount ? pageCount : undefined}
          />
        </label>
        <select
          aria-label="Rows per page"
          className={styles.pagination__goToPage__pageDropdown}
          value={pageSize}
          onChange={handlePageSizeChange}>
          {dataPerPage.map((size) => (
            <option key={size} value={size}>
              Show {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default Pagination;
