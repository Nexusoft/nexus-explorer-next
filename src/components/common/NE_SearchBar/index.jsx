import SearchBar from './SearchBar';
import PropTypes from 'prop-types';

Search.propTypes = {
  type: PropTypes.oneOf(['long']),
  long: PropTypes.bool,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  onSearch: PropTypes.func,
  suggestions: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.node,
      note: PropTypes.node,
    })
  ),
  onPick: PropTypes.func,
};

export default function Search(props) {
  return <SearchBar {...props} />;
}
