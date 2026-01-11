import { Link, useLocation } from 'react-router-dom';

const NavigationBar = () => {
  const location = useLocation();
  const isRestaurants = location.pathname === '/';
  const isMichelin = location.pathname === '/michelin';

  return (
    <div
      style={{
        backgroundColor: '#fefefe',
        borderBottom: '1px solid #e5e7eb',
        padding: '8px 20px',
        display: 'flex',
        justifyContent: 'center',
        gap: 20,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <Link
        to="/"
        style={{
          textDecoration: 'none',
          color: isRestaurants ? '#d97706' : '#666',
          fontSize: '13px',
          fontWeight: isRestaurants ? '600' : '500',
          padding: '4px 10px',
          borderRadius: '4px',
          transition: 'all 0.2s ease',
          backgroundColor: isRestaurants ? '#fff7ed' : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (!isRestaurants) {
            e.currentTarget.style.color = '#d97706';
            e.currentTarget.style.backgroundColor = '#fff7ed';
          }
        }}
        onMouseLeave={(e) => {
          if (!isRestaurants) {
            e.currentTarget.style.color = '#666';
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        Restaurants
      </Link>
      <Link
        to="/michelin"
        style={{
          textDecoration: 'none',
          color: isMichelin ? '#bd2333' : '#666',
          fontSize: '13px',
          fontWeight: isMichelin ? '600' : '500',
          padding: '4px 10px',
          borderRadius: '4px',
          transition: 'all 0.2s ease',
          backgroundColor: isMichelin ? '#fff5f5' : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (!isMichelin) {
            e.currentTarget.style.color = '#bd2333';
            e.currentTarget.style.backgroundColor = '#fff5f5';
          }
        }}
        onMouseLeave={(e) => {
          if (!isMichelin) {
            e.currentTarget.style.color = '#666';
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        Michelin
      </Link>
    </div>
  );
};

export default NavigationBar;

