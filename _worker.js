
function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, function(char) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char];
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/send-login-email") {
      if (request.method !== "POST") {
        return Response.json(
          { error: "Method not allowed" },
          { status: 405 }
        );
      }

      if (!env.BREVO_API_KEY) {
        return Response.json(
          { error: "Brevo API key is missing" },
          { status: 500 }
        );
      }

      try {
        const data = await request.json();

        const email = String(data.user_email || "").trim();
        const status = String(data.login_status || "").toUpperCase();

        if (
          !email ||
          !["SUCCESSFUL", "FAILED"].includes(status)
        ) {
          return Response.json(
            { error: "Invalid login information" },
            { status: 400 }
          );
        }

        const senderEmail = "kurtrussellalmario@gmail.com";

        const details = [
          ["Account", email],
          ["Login Status", status],
          ["Date", data.login_date],
          ["Street", data.login_street],
          ["Barangay", data.login_barangay],
          ["City", data.login_city],
          ["Province", data.login_region],
          ["Country", data.login_country],
          ["Latitude", data.login_latitude],
          ["Longitude", data.login_longitude],
          ["GPS Accuracy", data.login_accuracy]
        ];

        const htmlContent = `
          <h2>Tool Borrowing System</h2>
          <h3>Login Notification</h3>
          <table border="1" cellpadding="8" cellspacing="0">
            ${details.map(function(item) {
              return `
                <tr>
                  <th>${escapeHtml(item[0])}</th>
                  <td>${escapeHtml(item[1])}</td>
                </tr>
              `;
            }).join("")}
          </table>
        `;

        const response = await fetch(
          "https://api.brevo.com/v3/smtp/email",
          {
            method: "POST",
            headers: {
              "accept": "application/json",
              "api-key": env.BREVO_API_KEY,
              "content-type": "application/json"
            },
            body: JSON.stringify({
              sender: {
                name: "Tool Borrowing System",
                email: senderEmail
              },
              to: [
                { email: senderEmail }
              ],
              subject: status + " Login Notification",
              htmlContent: htmlContent
            })
          }
        );

        if (!response.ok) {
          return Response.json(
            { error: "Brevo failed to send the email" },
            { status: 502 }
          );
        }

        return Response.json({
          success: true,
          message: "Email notification sent"
        });

      } catch (error) {
        return Response.json(
          { error: "Invalid request or email error" },
          { status: 500 }
        );
      }
    }

    return env.ASSETS.fetch(request);
  }
};

