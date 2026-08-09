"use client";

type GTMProps = {
  position: "head" | "body";
  GTMId: string;
};

const GTagManager: React.FC<GTMProps> = ({
  position = "body",
  GTMId = "GTM-N3RDNBNP",
}) => {
  return (
    <>
      {position == "head" && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTMId}');
`,
          }}
        ></script>
      )}
      {position == "body" && (
        <noscript
          dangerouslySetInnerHTML={{
            __html: `
<iframe src="https://www.googletagmanager.com/ns.html?id=${GTMId}"
height="0" width="0" style="display:none;visibility:hidden"></iframe>
`,
          }}
        ></noscript>
      )}
    </>
  );
};

export default GTagManager;
