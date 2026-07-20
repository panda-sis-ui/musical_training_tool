import { Link } from 'react-router-dom';

export default function ComingSoon() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <h1>🚧 Скоро здесь появится новая игра!</h1>
      <Link to="/">🏠 Вернуться на главную</Link>
    </div>
  );
}