import { ExportSetting } from '../models/types';

async function exportPDF(
  node: SceneNode,
  exportSettings: ExportSetting
): Promise<void> {
  const filePrefix = node.name;
  const options = {
    format: 'pdf',
    ...exportSettings,
  };

  // Create a new page to export the node
  const page = figma.createPage();
  figma.currentPage = page;
  const frame = figma.createFrame();
  frame.name = filePrefix;
  frame.appendChild(node);
  page.appendChild(frame);

  // Export the PDF file
  const file = await frame.exportAsync(options);

  // Save the file to user's downloads folder
  const fileName = `${filePrefix}.${options.format}`;
  const bytes = await file.bytesAsync();
  const url = URL.createObjectURL(new Blob([bytes]));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);

  // Remove the temporary page
  page.remove();
}

export default exportPDF;
