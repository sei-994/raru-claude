
import { useState } from 'react';
import { useRouter } from 'next/router';

const AdminLogin = () => {
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'password') { // 簡単なパスワードチェック
      router.push('/admin/dashboard');
    } else {
      alert('パスワードが違います');
    }
  };

  return (
    <div>
      <h1 className="my-4">管理者ログイン</h1>
      <form onSubmit={handleLogin}>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">パスワード</label>
          <input type="password" className="form-control" id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary">ログイン</button>
      </form>
    </div>
  );
};

export default AdminLogin;
