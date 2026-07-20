import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as googleTTS from "google-tts-api";

const LOCAL_PHONEME_FILES: Record<string, string> = {
  a: 'sound_a.mp3',
  ai: 'sound_ai.mp3',
  ar: 'sound_ar.mp3',
  b: 'sound_b.mp3',
  c: 'sound_ck.mp3',
  ch: 'sound_ch.mp3',
  ck: 'sound_ck.mp3',
  d: 'sound_d.mp3',
  e: 'sound_e.mp3',
  ee: 'sound_ee.mp3',
  er: 'sound_er.mp3',
  f: 'sound_f.mp3',
  g: 'sound_g.mp3',
  h: 'sound_h.mp3',
  i: 'sound_i.mp3',
  ie: 'sound_ie.mp3',
  j: 'sound_j.mp3',
  k: 'sound_k.mp3',
  l: 'sound_l.mp3',
  m: 'sound_m.mp3',
  n: 'sound_n.mp3',
  ng: 'sound_ng.mp3',
  o: 'sound_o.mp3',
  oa: 'sound_oa.mp3',
  oi: 'sound_oi.mp3',
  oo: 'sound_oo.mp3',
  ooo: 'sound_ooo.mp3',
  or: 'sound_or.mp3',
  ou: 'sound_ou.mp3',
  p: 'sound_p.mp3',
  q: 'sound_qu.mp3',
  qu: 'sound_qu.mp3',
  r: 'sound_r.mp3',
  s: 'sound_s.mp3',
  sh: 'sound_sh.mp3',
  t: 'sound_t.mp3',
  th: 'sound_th.mp3',
  thh: 'sound_thh.mp3',
  u: 'sound_u.mp3',
  ue: 'sound_ue.mp3',
  v: 'sound_v.mp3',
  w: 'sound_w.mp3',
  x: 'sound_x.mp3',
  y: 'sound_y.mp3',
  z: 'sound_z.mp3',
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/phonemes/:letter", (req, res) => {
    const letter = req.params.letter.toLowerCase();
    const localFile = LOCAL_PHONEME_FILES[letter];

    if (!localFile) {
      return res.status(404).json({ error: "Phoneme not found" });
    }

    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.sendFile(path.join(process.cwd(), 'Phonics sound', localFile));
  });

  app.post("/api/tts", async (req, res) => {
    try {
      const { text } = req.body;
      
      const base64Audio = await googleTTS.getAudioBase64(text, {
        lang: 'en-US',
        slow: false,
        host: 'https://translate.google.com',
        timeout: 10000,
      });

      if (base64Audio) {
        res.json({ audio: base64Audio });
      } else {
        res.status(500).json({ error: "Failed to generate audio" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
