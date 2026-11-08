import ErrorMessage from 'components/common/NE_ErrorMessage';
import Loader from 'components/common/NE_Loader';
import { Fragment } from 'react';

export default function PromiseLayout(props) {
  const {
    children = <></>,
    error = {},
    isError = false,
    isLoading = false,
  } = props;

  return (
    <Fragment>
      {isLoading && <Loader />}
      {isError && <ErrorMessage error={error} />}
      {!isLoading && !isError && children}
    </Fragment>
  );
}
