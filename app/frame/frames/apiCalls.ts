import { GraphQLClient, gql } from 'graphql-request';

// Define our GraphQL client
const graphQLClient = new GraphQLClient(
    "https://api.airstack.xyz/graphql", {
    headers: {
        Authorization: process.env.AIRSTACK_API_KEY!,
    }
}
);

// Define types for our response
interface Reply {
    rawText: string;
}

interface FarcasterRepliesResponse {

        FarcasterReplies: {
            Reply: Reply[];
        }

}

/**
 * Checks if a requester has paid the minimum fee in $DEGEN
 * @param requester - The FID of the requester
 * @param minFee - The minimum fee required in $DEGEN
 * @param parentCastHash - The hash of the parent cast
 * @returns A promise that resolves to true if the requester has paid, false otherwise
 */
const hasPaid = async (requester: string | number, minFee: number, parentCastHash: string): Promise<boolean> => {
    try {
        // Construct the query
        const query = gql`
      query CheckPayment($HASH: String, $REPLIER: Identity) {
        FarcasterReplies(
          input: {filter: {parentHash: {_eq: $HASH}, repliedBy: {_eq: $REPLIER}}, blockchain: ALL}
        ) {
          Reply {
            rawText
          }
        }
      }
    `;

        // Convert requester to string format expected by the API
        const replierIdentity = typeof requester === 'number' ? `fc_fid:${requester}` : requester;

        // Set variables
        const variables = {
            HASH: parentCastHash,
            REPLIER: replierIdentity
        };

        // Execute the query
        const response = await graphQLClient.request<FarcasterRepliesResponse>(query, variables);

        // Extract replies
        const replies = response.FarcasterReplies.Reply;

        // Check if any reply contains a payment that meets the minimum fee
        return replies.some(reply => {
            // Use regex to match payment format like "100 $DEGEN"
            const paymentRegex = /(\d+(?:\.\d+)?)\s*\$DEGEN/i;
            const match = reply.rawText.match(paymentRegex);

            if (match) {
                const amount = parseFloat(match[1]);
                return amount >= minFee;
            }

            return false;
        });
    } catch (error) {
        console.error('Error checking payment:', error);
        return false;
    }
};

export default hasPaid;