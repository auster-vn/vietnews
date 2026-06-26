import { processUnrenderedArticles, renderSingleArticle } from './cloudinary_uploader';

async function main() {
  const args = process.argv.slice(2);
  const idIndex = args.indexOf('--id');
  if (idIndex !== -1 && args[idIndex + 1]) {
    const id = args[idIndex + 1];
    const success = await renderSingleArticle(id);
    if (success) {
      console.log(`Successfully rendered single article: ${id}`);
      process.exit(0);
    } else {
      console.error(`Failed to render single article: ${id}`);
      process.exit(1);
    }
  } else {
    const count = await processUnrenderedArticles(5);
    console.log(`Rendered and uploaded ${count} articles.`);
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Error in render worker:', err);
  process.exit(1);
});
