import DropdownMenu from 'components/atoms/NE_Dropdown';

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  title: 'Components/DropdownMenu',
  component: DropdownMenu,
};

const Template = (args) => <DropdownMenu {...args} />;

export const Default = Template.bind({});
Default.args = {
  title: 'Blockchain',
  children: [
    <a href="https://nexplorer.vercel.app/blocks">Blocks</a>,
    <a href="https://nexplorer.vercel.app/transactions">Transactions</a>,
  ],
};