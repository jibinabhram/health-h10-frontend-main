import RNFS from 'react-native-fs';
import Share from 'react-native-share';

export const downloadPods = async (pods: any[]) => {
  try {
    if (!pods || !pods.length) {
      console.log('❌ No pods to export');
      return;
    }

    const csv =
      'Serial Number,Device ID\n' +
      pods.map(p => `${p.serial},${p.deviceId}`).join('\n');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `pods_${timestamp}.csv`;
    const filePath = `${RNFS.DownloadDirectoryPath}/${fileName}`;

    // 1️⃣ write file
    await RNFS.writeFile(filePath, csv, 'utf8');
    console.log('✅ CSV written to:', filePath);

    // 2️⃣ VERIFY file exists
    const exists = await RNFS.exists(filePath);
    console.log('📁 File exists:', exists);

    // 3️⃣ VERIFY file size
    if (exists) {
      const stat = await RNFS.stat(filePath);
      console.log('📦 File size:', stat.size, 'bytes');
    }

    // 4️⃣ open share dialog
    await Share.open({
      url: 'file://' + filePath,
      type: 'text/csv',
      filename: fileName,
      failOnCancel: false,
    });

  } catch (err: any) {
    if (err?.message?.includes('User did not share')) {
      console.log('ℹ User cancelled share');
      return;
    }
    console.error('❌ Download error:', err);
  }
};
