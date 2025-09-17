import fs from 'fs';
import path from 'path';

const talentsFilePath = path.join(process.cwd(), 'data', 'talents.json');

export default function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const fileContents = fs.readFileSync(talentsFilePath, 'utf8');
      const data = JSON.parse(fileContents);
      res.status(200).json(data.talents);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'タレントの取得中にサーバーエラーが発生しました。' });
    }
  } else if (req.method === 'POST') {
    try {
      const {
        name_ja, name_en, slug, birthdate, birthplace, height, hobby, skill, 
        profile, image, mv_images, history, instagram, tiktok
      } = req.body;

      // Basic validation
      if (!name_ja || !slug) {
        return res.status(400).json({ message: '日本語名とスラッグは必須です。' });
      }

      const fileContents = fs.readFileSync(talentsFilePath, 'utf8');
      const data = JSON.parse(fileContents);

      // Process mv_images string into an array
      const mvImagesArray = mv_images ? mv_images.split('\n').filter(url => url.trim() !== '') : [];

      // Process history string into an array of objects
      const historyArray = history ? history.split('\n').filter(line => line.trim() !== '').map(line => {
        const [year, event] = line.split(',');
        return { year: year ? year.trim() : '', event: event ? event.trim() : '' };
      }) : [];

      const newTalent = {
        id: data.talents.length > 0 ? Math.max(...data.talents.map(t => t.id)) + 1 : 1,
        name_ja,
        name_en,
        slug,
        image: image || '',
        profile: profile || '',
        mv_images: mvImagesArray,
        instagram: instagram || '',
        tiktok: tiktok || '',
        birthdate: birthdate || '',
        birthplace: birthplace || '',
        height: height || '',
        hobby: hobby || '',
        skill: skill || '',
        history: historyArray
      };

      data.talents.push(newTalent);

      fs.writeFileSync(talentsFilePath, JSON.stringify(data, null, 2));

      res.status(200).json({ message: 'タレントが正常に追加されました。' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'サーバーエラーが発生しました。' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ message: '削除するタレントのIDが必要です。' });
      }

      const talentId = parseInt(id, 10);
      if (isNaN(talentId)) {
        return res.status(400).json({ message: '無効なタレントIDです。' });
      }

      const fileContents = fs.readFileSync(talentsFilePath, 'utf8');
      let data = JSON.parse(fileContents);

      const initialLength = data.talents.length;
      data.talents = data.talents.filter(talent => talent.id !== talentId);

      if (data.talents.length === initialLength) {
        return res.status(404).json({ message: '指定されたIDのタレントが見つかりませんでした。' });
      }

      fs.writeFileSync(talentsFilePath, JSON.stringify(data, null, 2));

      res.status(200).json({ message: 'タレントが正常に削除されました。' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'タレントの削除中にサーバーエラーが発生しました。' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}