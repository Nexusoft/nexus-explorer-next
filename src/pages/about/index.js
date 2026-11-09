import { LinksTypes } from 'types/LinksTypes';
import { forBuild } from 'utils/common/fetch';
import PageHeader from 'components/Header/PageHeader';
import AboutView from 'components/Views/About';
import Layout from 'components/Layout';

export const getStaticProps = async () => {
  //github can be offline, slow or rate limited, the page still builds without the list
  const res = await forBuild(fetch(LinksTypes.LINKS.CONTRIBUTORS_API));
  const data = (res?.ok && (await forBuild(res.json()))) || [];

  return {
    props: { data },
    revalidate: 86400,
  };
};

const About = ({ data }) => {
  return (
    <Layout>
      <PageHeader page="about" />
      <AboutView data={data} />
    </Layout>
  );
};

export default About;
