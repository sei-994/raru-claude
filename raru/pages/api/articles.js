
import fs from 'fs';
import path from 'path';

const articlesFilePath = path.join(process.cwd(), 'data', 'articles.json');

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { title, content } = req.body;

    const articlesData = JSON.parse(fs.readFileSync(articlesFilePath));
    const newArticle = {
      id: articlesData.articles.length + 1,
      title,
      content,
      date: new Date().toISOString().slice(0, 10),
    };

    articlesData.articles.push(newArticle);
    fs.writeFileSync(articlesFilePath, JSON.stringify(articlesData, null, 2));

    res.status(200).json(newArticle);
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
