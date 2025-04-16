export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;
    const fileName = url.searchParams.get("file");

    // إعداد رؤوس CORS
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    // التعامل مع طلب OPTIONS (Preflight)
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // رفع ملف
    if (method === 'POST' && pathname === '/upload') {
      const formData = await request.formData();
      const file = formData.get('file');

      if (!file || typeof file === 'string') {
        return new Response('No file provided', {
          status: 400,
          headers: corsHeaders
        });
      }

      const key = file.name || 'unnamed_file';
      await env.MY_BUCKET.put(key, file.stream(), {
        httpMetadata: { contentType: file.type }
      });

      const publicUrl = `https://${request.headers.get("host")}/download?file=${key}`;
      return new Response(JSON.stringify({ success: true, url: publicUrl }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }

    // تحميل ملف
    if (method === 'GET' && pathname === '/download') {
      if (!fileName) return new Response('Missing file name', {
        status: 400,
        headers: corsHeaders
      });

      const object = await env.MY_BUCKET.get(fileName);
      if (!object) return new Response('File not found', {
        status: 404,
        headers: corsHeaders
      });

      return new Response(object.body, {
        headers: {
          'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
          ...corsHeaders
        }
      });
    }

    // حذف ملف
    if (method === 'DELETE' && pathname === '/delete') {
      if (!fileName) return new Response('Missing file name', {
        status: 400,
        headers: corsHeaders
      });

      await env.MY_BUCKET.delete(fileName);
      return new Response(JSON.stringify({ success: true, message: `File "${fileName}" deleted.` }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }

    // في حال لم يتطابق أي مسار
    return new Response('Not found', {
      status: 404,
      headers: corsHeaders
    });
  }
};
