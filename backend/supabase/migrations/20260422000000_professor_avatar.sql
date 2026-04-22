ALTER TABLE professor ADD COLUMN avatar TEXT;

UPDATE professor
SET avatar = (ARRAY[
    'professor-avatars/1.jpeg',
    'professor-avatars/2.webp',
    'professor-avatars/3.jpeg',
    'professor-avatars/4.webp',
    'professor-avatars/5.jpeg',
    'professor-avatars/6.jpeg',
    'professor-avatars/7.jpg',
    'professor-avatars/8.webp',
    'professor-avatars/9.jpeg',
    'professor-avatars/10.png'
])[FLOOR(RANDOM() * 10 + 1)::INT]
WHERE avatar IS NULL;
