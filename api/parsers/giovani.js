const BLOB_URL =
  "https://e3ysmayz4e4ch5bu.public.blob.vercel-storage.com/data/giovani-data.json";

export async function getGiovaniProjects() {
  try {
    const response = await fetch(BLOB_URL);

    if (!response.ok) {
      return [];
    }

    return await response.json();
  } catch {
    return [];
  }
}