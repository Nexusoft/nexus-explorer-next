import Layout from 'components/Layout';
import PageHeader from 'components/Header/PageHeader';
import CustomError from 'components/Views/error';

const ErrorScreen = (props) => {
  return (
    <Layout>
      <PageHeader
        page={props.statusCode == 404 ? 'NOT_FOUND' : 'HOME'}
        title={
          props.statusCode && props.statusCode != 404
            ? `Error ${props.statusCode} | Nexus Explorer`
            : undefined
        }
      />
      <CustomError {...props} />
    </Layout>
  );
};

ErrorScreen.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default ErrorScreen;
