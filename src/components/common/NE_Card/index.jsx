import PropTypes from 'prop-types';
import TYPES from 'types';
import { cls } from 'utils';
import styles from './Card.module.scss';
import { NE_CompactCard } from './NE_CompactCard';
import { NE_DetailCard } from './NE_DetailCard';
import { NE_SmallCard } from './NE_SmallCard';

const Card = ({
  type = 'default',
  isloading,
  className,
  children,
  isLive,
  ...rest
}) => {
  if (type === 'small') return <NE_SmallCard {...rest} />;
  if (type === 'compact') return <NE_CompactCard {...rest} />;
  if (type === 'market' || type === 'basic')
    return <NE_DetailCard type={type} {...rest} />;

  return (
    <section
      {...rest}
      className={cls(
        className,
        styles['card'],
        isloading && styles['loading']
      )}>
      {children}
      <div className={cls(styles['card-live-state'], 'live-color')}></div>
      <style jsx>{`
        .live-color {
          background-color: ${isLive
            ? TYPES.COLORS.MARKET_GREEN
            : TYPES.COLORS.TRANSPARENT};
        }
      `}</style>
    </section>
  );
};

export default Card;
export { NE_CompactCard, NE_DetailCard, NE_SmallCard };

Card.propTypes = {
  type: PropTypes.oneOf(['default', 'small', 'basic', 'compact', 'market']),
  isloading: PropTypes.bool,
};
