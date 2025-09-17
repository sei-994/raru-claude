import { formidable } from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'talents');

// Ensure the upload directory exists
fs.mkdirSync(uploadDir, { recursive: true });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const form = formidable({
    uploadDir: uploadDir,
    keepExtensions: true,
    filename: (name, ext, part, form) => {
      // Sanitize filename and make it unique
      const sanitizedName = part.originalFilename.replace(/[^a-zA-Z0-9_.-]/g, '_');
      return `${Date.now()}-${sanitizedName}`;
    }
  });

  try {
    const [fields, files] = await form.parse(req);
    
    const uploadedFiles = [];
    for (const key in files) {
      const fileArray = Array.isArray(files[key]) ? files[key] : [files[key]];
      fileArray.forEach(file => {
        uploadedFiles.push({
          fieldName: key,
          path: `/uploads/talents/${path.basename(file.filepath)}`
        });
      });
    }

    res.status(200).json({ message: 'Files uploaded successfully', files: uploadedFiles });
  } catch (err) {
    console.error('Error uploading files:', err);
    res.status(500).json({ message: 'Error uploading files' });
  }
}
