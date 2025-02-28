# Image Obfuscater (DegenFrame Edition)

This project is a Next.js application that allows users to create and share "obfuscated" or edited images, potentially with paywall or contest features, integrated with the Farcaster social network. It leverages the Frames technology to provide rich interactive experiences directly within the Farcaster feed.

## Features

-   **Image Upload and Editing:** Users can upload an original image and receive an edited version of that image.
-   **Note/Caption:** Users can add a note or caption to be shown to those who view the original image.
-   **Paywalled Content:** Creators can set an unlock fee (in $DEGEN) for users to access the edited image.
    -   **Payment Validation:** When a paywall is active, it validates that users have paid the required amount in $DEGEN before allowing them to unlock the edited image.
-   **Contests:** Creators can organize contests where users can guess the original image and the winner(s) gets a prize.
- **Frames Integration**: Enables the interactive experience of sharing and interacting with edited images within Farcaster.

## Technology Stack

-   **Next.js:** React framework for building the application.
-   **TypeScript:** For type safety and improved code maintainability.
-   **Prisma:** ORM for database interactions.
-   **Farcaster Frames:** For creating interactive experiences within Farcaster.
-   **Pinata:** Used as a Farcaster Hub to retrieve user data.
-   **Lum0x Tip API:** Used to validate payment transactions for paywalled content.
- **frames.js**: for building the frames.

## Getting Started

### Prerequisites

-   Node.js (v18 or higher recommended)
-   npm or yarn
-   A running instance of a Farcaster Hub (e.g., Pinata's hosted Hub or a self-hosted one)
-   A database (e.g., PostgreSQL, MySQL) set up for Prisma
- You need to have a tip address registered on the Lum0x.com website.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/iamlotp/2025-02-23-image-obfuscater.git
    cd 2025-02-23-image-obfuscater
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Set up the `.env` file:**
    Create a `.env.local` file in the root directory of the project. You'll need to add the URL of your database there. You may use prisma studio to configure your database.
    ```
    DATABASE_URL="your_database_url"
    ```
4.  **Run Prisma migrations:**
    ```bash
    npx prisma migrate dev --name init
    ```

5. **Run the project:**
    ```bash
    npm run dev
    #or
    yarn dev
    ```
    
### Project structure

-   **`app/`:** The main directory for the Next.js application.
    -   **`api/`:** API routes for handling image processing and other server-side logic.
        -   **`process-image/`:** This contains the logic for saving images and their metadata to the database.
    - **`frame/`**: Contains all the code to handle the frames.
        - **`frames/`**:
            - **`frames.ts`**: Contains the definition of the frames.
            - **`apiCalls.ts`**: Contains functions to call the pinata hub, and the tip api.
    -  **`constants.ts`**: Defines the app url.
-   **`lib/`:** Shared code and utilities.
    -   **`prisma.ts`:** Prisma client initialization.
-   **`public/`:** Static assets, including uploaded images.

## How It Works

1.  **Image Upload:** Users upload an original and an edited image via a form.
2.  **Metadata:** Users provide a note/caption, and select whether the post is a paywall or a contest, as well as the corresponding values.
3. **Fid**: The fid of the user is retrieved from the form, and the username is retrieved using the Pinata hub.
4.  **Storage:** The images are saved to the `public/uploads` directory.
5.  **Database:** The image paths, note, fid, username, and paywall/contest information are saved to the database.
6.  **Paywall Validation:** When a user wants to unlock a paywalled image, the application checks the Lum0x Tip API to verify if they have sent the required $DEGEN amount to the creator.
7. **Frames integration:** The project enables the interaction with the images directly in the farcaster feed.

## API Endpoints

-   **`POST /api/process-image`:**
    -   **Description:** Uploads images and related metadata to the server.
    -   **Request Body:** `FormData` containing `original`, `edited`, `note`, `fid`, `frameType`, `unlockFee`, and `prizeAmount`.
    -   **Response:** JSON with `{ success: true, id: record.id }` on success.

## Payment Validation

- The `validatePayment` function in `app/frame/frames/apiCalls.ts` handles the verification process for paywalled content.
- It checks for replies on the parent cast, looking for a message from the requester containing the required amount of $DEGEN.
- It then uses the Lum0x Tip API to confirm that the transaction is valid.

## Contributing

Contributions are welcome! If you find a bug or want to propose a new feature, please open an issue or a pull request.

## License

[MIT](https://opensource.org/license/mit/)

## Credits

- Lum0x for the Tip API
- Pinata for the Hub.
