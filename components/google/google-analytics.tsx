"use-client";

type GAProps = {
  GAId: string;
};

const GAnalytics: React.FC<GAProps> = ({ GAId = "G-7Q6J9HYDY4" }) => {
  return (
    <>
      <script
        async
        src={"https://www.googletagmanager.com/gtag/js?id=" + GAId}
      ></script>
      <script
        dangerouslySetInnerHTML={{
          __html: `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', '${GAId}');
`,
        }}
      ></script>
    </>
  );
};

export default GAnalytics;
