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

    private CallbackContext onNewIntentCallbackContext = null;

    //public boolean execute(String action, JSONArray args, String callbackId) {
    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) {
        // Log.d(args);
        if (action.equals("getFileName")) {
            try {
                Context context = cordova.getActivity().getApplicationContext();
                URI fileuri = new URI("http://android.com/");
                // Get the file path from the URI
                final String path = FileUtils.getPath(context, fileuri);
                callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, path));
                // Log.d(path);

            } catch (Exception e) {
                Log.e("FileSelectorTestActivity", "File select error", e);
            }
            return true;
        }
        return false;
    }
}
