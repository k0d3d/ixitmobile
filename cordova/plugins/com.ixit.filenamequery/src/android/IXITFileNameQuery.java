package com.ixit.filenamequery;

import java.util.HashMap;
import java.util.Map;

import org.apache.cordova.CordovaActivity;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

// import android.content.Intent;
// import android.net.Uri;
import android.text.Html;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaResourceApi;
import org.apache.cordova.PluginResult;


import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.View.OnClickListener;
import android.widget.Button;
import android.widget.Toast;

import android.content.Context;

import com.ipaulpro.afilechooser.utils.FileUtils;

public class IXITFileNameQuery extends CordovaPlugin {

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) {
        Log.d("IXITFileNameQuery",args);
        if (action.equals("getFileName")) {
            try {
                Context context = cordova.getActivity().getApplicationContext();
                // ArrayList<String> list = new ArrayList<String>();
                System.out.println(args[0]);
                Uri fileuri = Uri.parse(args[0]);
                // Get the file path from the URI
                final String path = FileUtils.getPath(context, fileuri);
                Log.d("IXITFileNameQuery", path);
                callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, path));
                return true;
                // Log.d(path);

            } catch (Exception e) {
                Log.e("FileSelectorTestActivity", "File select error", e);
                return false;
            }
        }
    }
}
