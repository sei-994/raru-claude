import { useState, useEffect } from 'react';

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Article state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Talent state
  const [talentForm, setTalentForm] = useState({
    name_ja: '', name_en: '', slug: '', birthdate: '', birthplace: '', height: '',
    hobby: '', skill: '', profile: '', history: '', instagram: '', tiktok: ''
  });
  const [mainImageFile, setMainImageFile] = useState(null);
  const [carouselImageFiles, setCarouselImageFiles] = useState([]);
  const [talents, setTalents] = useState([]); // New state for talents

  useEffect(() => {
    const password = prompt('パスワードを入力してください');
    if (password === 'password') {
      setIsAuthenticated(true);
      fetchTalents(); // Fetch talents when authenticated
    } else {
      alert('パスワードが違います。');
    }
  }, []);

  // New function to fetch talents
  const fetchTalents = async () => {
    try {
      const res = await fetch('/api/talents');
      if (res.ok) {
        const data = await res.json();
        setTalents(data);
      } else {
        console.error('Failed to fetch talents');
      }
    } catch (error) {
      console.error('Error fetching talents:', error);
    }
  };

  const handleTalentChange = (e) => {
    const { name, value } = e.target;
    setTalentForm(prevForm => ({ ...prevForm, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (name === 'mainImage') {
      setMainImageFile(files[0]);
    } else if (name === 'carouselImages') {
      setCarouselImageFiles(Array.from(files));
    }
  };

  const handleAddArticle = async (e) => {
    e.preventDefault();
    // ... (article logic remains the same)
  };

  const handleAddTalent = async (e) => {
    e.preventDefault();
    let mainImageUrl = '';
    let carouselImageUrls = [];

    // 1. Upload images if they exist
    const formData = new FormData();
    let filesToUpload = false;
    if (mainImageFile) {
      formData.append('mainImage', mainImageFile);
      filesToUpload = true;
    }
    if (carouselImageFiles.length > 0) {
      carouselImageFiles.forEach(file => formData.append('carouselImages', file));
      filesToUpload = true;
    }

    if (filesToUpload) {
      try {
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) throw new Error('Image upload failed');
        
        const uploadData = await uploadRes.json();
        mainImageUrl = uploadData.files.find(f => f.fieldName === 'mainImage')?.path || '';
        carouselImageUrls = uploadData.files.filter(f => f.fieldName === 'carouselImages').map(f => f.path);

      } catch (error) {
        alert(`画像アップロードエラー: ${error.message}`);
        return;
      }
    }

    // 2. Submit talent data with image URLs
    const finalTalentData = {
      ...talentForm,
      image: mainImageUrl,
      mv_images: carouselImageUrls.join('\n'), // API expects a newline-separated string
    };

    try {
      const res = await fetch('/api/talents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalTalentData),
      });

      if (res.ok) {
        alert('タレントを追加しました');
        setTalentForm({ name_ja: '', name_en: '', slug: '', birthdate: '', birthplace: '', height: '', hobby: '', skill: '', profile: '', history: '', instagram: '', tiktok: '' });
        setMainImageFile(null);
        setCarouselImageFiles([]);
        document.getElementById('mainImageInput').value = null;
        document.getElementById('carouselImagesInput').value = null;
        fetchTalents(); // Re-fetch talents after adding
      } else {
        const errorData = await res.json();
        alert(`タレントの追加に失敗しました: ${errorData.message}`);
      }
    } catch (error) {
      alert(`エラー: ${error.message}`);
    }
  };

  // New function to handle talent deletion
  const handleDeleteTalent = async (id) => {
    if (window.confirm('本当にこのタレントを削除しますか？')) {
      try {
        const res = await fetch(`/api/talents?id=${id}`, {
          method: 'DELETE',
        });

        if (res.ok) {
          alert('タレントを削除しました');
          fetchTalents(); // Re-fetch talents after deleting
        } else {
          const errorData = await res.json();
          alert(`タレントの削除に失敗しました: ${errorData.message}`);
        }
      } catch (error) {
        alert(`エラー: ${error.message}`);
      }
    }
  };

  if (!isAuthenticated) return <div>アクセス権がありません。</div>;

  return (
    <div className="container my-5">
      <h1 className="my-4">管理者ダッシュボード</h1>
      <section className="mb-5">
        <h2 className="my-4">タレント追加</h2>
        <form onSubmit={handleAddTalent}>
          {/* Text fields ... */}
          <div className="mb-3"><label>日本語名</label><input type="text" name="name_ja" value={talentForm.name_ja} onChange={handleTalentChange} className="form-control" required /></div>
          <div className="mb-3"><label>英字名</label><input type="text" name="name_en" value={talentForm.name_en} onChange={handleTalentChange} className="form-control" /></div>
          <div className="mb-3"><label>スラッグ</label><input type="text" name="slug" value={talentForm.slug} onChange={handleTalentChange} className="form-control" required /></div>
          <div className="mb-3"><label>生年月日</label><input type="date" name="birthdate" value={talentForm.birthdate} onChange={handleTalentChange} className="form-control" /></div>
          <div className="mb-3"><label>出身地</label><input type="text" name="birthplace" value={talentForm.birthplace} onChange={handleTalentChange} className="form-control" /></div>
          <div className="mb-3"><label>身長</label><input type="text" name="height" value={talentForm.height} onChange={handleTalentChange} className="form-control" /></div>
          <div className="mb-3"><label>趣味</label><input type="text" name="hobby" value={talentForm.hobby} onChange={handleTalentChange} className="form-control" /></div>
          <div className="mb-3"><label>特技</label><input type="text" name="skill" value={talentForm.skill} onChange={handleTalentChange} className="form-control" /></div>
          <div className="mb-3"><label>プロフィール</label><textarea name="profile" value={talentForm.profile} onChange={handleTalentChange} className="form-control" rows="3"></textarea></div>
          <div className="mb-3"><label>History</label><textarea name="history" value={talentForm.history} onChange={handleTalentChange} className="form-control" rows="4"></textarea></div>
          <div className="mb-3"><label>Instagram URL</label><input type="text" name="instagram" value={talentForm.instagram} onChange={handleTalentChange} className="form-control" /></div>
          <div className="mb-3"><label>TikTok URL</label><input type="text" name="tiktok" value={talentForm.tiktok} onChange={handleTalentChange} className="form-control" /></div>
          
          {/* File inputs */}
          <div className="mb-3">
            <label htmlFor="mainImageInput" className="form-label">メイン画像</label>
            <input type="file" name="mainImage" id="mainImageInput" onChange={handleFileChange} className="form-control" />
          </div>
          <div className="mb-3">
            <label htmlFor="carouselImagesInput" className="form-label">自動で流れる画像 (複数選択可)</label>
            <input type="file" name="carouselImages" id="carouselImagesInput" onChange={handleFileChange} className="form-control" multiple />
          </div>

          <button type="submit" className="btn btn-primary">タレント追加</button>
        </form>
      </section>

      <section className="mb-5">
        <h2 className="my-4">既存タレント</h2>
        {talents.length === 0 ? (
          <p>タレントはまだ登録されていません。</p>
        ) : (
          <table className="table table-striped">
            <thead>
              <tr>
                <th>ID</th>
                <th>日本語名</th>
                <th>英字名</th>
                <th>スラッグ</th>
                <th>アクション</th>
              </tr>
            </thead>
            <tbody>
              {talents.map(talent => (
                <tr key={talent.id}>
                  <td>{talent.id}</td>
                  <td>{talent.name_ja}</td>
                  <td>{talent.name_en}</td>
                  <td>{talent.slug}</td>
                  <td>
                    <button 
                      className="btn btn-danger btn-sm" 
                      onClick={() => handleDeleteTalent(talent.id)}
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      {/* Article Section remains the same... */}
    </div>
  );
};

export default AdminDashboard;
