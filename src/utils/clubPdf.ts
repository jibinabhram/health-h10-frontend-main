import RNPrint from 'react-native-print';
import Share from 'react-native-share';

export const generateClubPdf = async (club: any) => {
  try {
    const html = `
      <html>
        <body style="font-family: Arial; padding: 24px">
          <h1>${club.club_name}</h1>

          <h3>Club Details</h3>
          <p><b>Address:</b> ${club.address}</p>
          <p><b>Sport:</b> ${club.sport || 'N/A'}</p>
          <p><b>Status:</b> ${club.status}</p>

          <hr />

          <h3>Pod Holders</h3>
          ${
            club.pod_holders?.length
              ? `<ul>
                  ${club.pod_holders
                    .map((p: any) => `<li>${p.serial_number}</li>`)
                    .join('')}
                </ul>`
              : '<p>No pod holders assigned</p>'
          }

          <hr />

          <h3>Club Admin</h3>
          ${
            club.admin
              ? `
                <p><b>Name:</b> ${club.admin.name}</p>
                <p><b>Email:</b> ${club.admin.email}</p>
                <p><b>Phone:</b> ${club.admin.phone || 'N/A'}</p>
                <p><b>Temporary Password:</b> ${club.admin.temp_password || 'N/A'}</p>
              `
              : '<p>No admin assigned</p>'
          }

          <hr />
           <!--<p style="font-size:12px">add any notes if you want</p>-->
        </body>
      </html>
    `;

    await RNPrint.print({ html });
  } catch (err) {
    console.log('❌ PDF PRINT ERROR:', err);
  }
};

