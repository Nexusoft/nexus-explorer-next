import { LinksTypes } from 'types/LinksTypes';
import PageHeader from 'components/Header/PageHeader';
import AboutView from 'components/Views/About';
import Layout from 'components/Layout';

export const getStaticProps = async () => {
  //github can be offline or rate limited, the page still builds without the list
  let data = [];
  try {
    const res = await fetch(LinksTypes.LINKS.CONTRIBUTORS_API);
    if (res.ok) data = await res.json();
  } catch (e) {
    data = [];
  }

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
