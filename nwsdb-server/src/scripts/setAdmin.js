require('dotenv').config();
const { FieldValue } = require('firebase-admin/firestore');
const { getFirebaseAuth, getFirebaseFirestore } = require('../config/firebase');

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('Usage: npm run set-admin -- user@nwsdb.lk');
    process.exit(1);
  }

  const auth = getFirebaseAuth();
  const user = await auth.getUserByEmail(email);
  const claims = { ...(user.customClaims || {}), role: 'admin', active: true };

  await auth.setCustomUserClaims(user.uid, claims);

  try {
    await getFirebaseFirestore()
      .collection('users')
      .doc(user.uid)
      .set(
        {
          email: user.email || email,
          displayName: user.displayName || '',
          role: 'admin',
          active: true,
          updatedAt: FieldValue.serverTimestamp()
        },
        { merge: true }
      );
  } catch (error) {
    console.warn(`Firestore profile sync skipped: ${error.message}`);
  }

  console.log(`Administrator role granted to ${email} (${user.uid}).`);
  console.log('The user must sign out and sign in again for the new role to take effect.');
}

main().catch((error) => {
  console.error(`Failed to grant administrator role: ${error.message}`);
  process.exit(1);
});
