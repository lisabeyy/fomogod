import { NextResponse } from 'next/server';

const JSONBIN_API_URL = 'https://api.jsonbin.io/v3/b/6821e6498960c979a597e7a3';
const MASTER_KEY = '$2a$10$xPOM5lC7eajfbJGrycduo.UDISzuxzvrkd4hm./.9uYTLkHV3aY..';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // First, get the current waitlist
    const getResponse = await fetch(`${JSONBIN_API_URL}/latest`, {
      headers: {
        'X-Master-Key': MASTER_KEY,
      },
    });

    if (!getResponse.ok) {
      throw new Error('Failed to fetch current waitlist');
    }

    const { record: currentWaitlist } = await getResponse.json();
    
    console.log("currentWaitlist", currentWaitlist);
    // Check if email already exists
    if (currentWaitlist.includes(email)) {
      return NextResponse.json(
        { error: 'Email already on waitlist' },
        { status: 400 }
      );
    }

    // Add new email to waitlist
    const updatedWaitlist = [...currentWaitlist, email];

    // Update the JSONBin
    const updateResponse = await fetch(JSONBIN_API_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': MASTER_KEY,
      },
      body: JSON.stringify(updatedWaitlist),
    });

    if (!updateResponse.ok) {
      throw new Error('Failed to update waitlist');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Waitlist error:', error);
    return NextResponse.json(
      { error: 'Failed to add to waitlist' },
      { status: 500 }
    );
  }
} 