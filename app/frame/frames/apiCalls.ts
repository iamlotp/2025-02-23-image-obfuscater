interface CastMessage {
  data: {
    fid: number;
    castAddBody: {
      text: string;
    };
  };
  hash: string;
}

interface TipResponse {
  status: string;
}

export async function validatePayment(
  requester: string | number,
  minFee: number,
  parentCast: { fid: number; hash: `0x${string}` }
): Promise<boolean | 'Pending' | 'Invalid'> {
  try {
    // Fetch replies to the parent cast
    const castsResponse = await fetch(
      `https://hub.pinata.cloud/v1/castsByParent?fid=${parentCast.fid}&hash=${parentCast.hash}&reverse=true&pageSize=700`
    );
    const castsData = await castsResponse.json();
    
    // Find matching payment message from requester
    const requesterCast = castsData.messages.find((message: CastMessage) => {
      if (message.data.fid.toString() !== requester.toString()) return false;
      
      // Check for payment amount in message text
      const text = message.data.castAddBody.text;
      const match = text.match(/(\d+)\s*\$DEGEN/i);
      if (!match) return false;
      
      const amount = parseInt(match[1]);
      return amount >= minFee;
    });

    if (!requesterCast) return false;


    // Validate payment status
    const tipResponse = await fetch(
      `https://tipapi.lum0x.com/api/getTxHash/${requesterCast.hash}`
    );
    if (tipResponse.status === 500) {
      return 'Pending'
    }
    const tipData: TipResponse = await tipResponse.json();

    return tipData.status === "Valid" ? true : 'Invalid';
  } catch (error) {
    console.error("Payment validation error:", error);
    return false;
  }
}